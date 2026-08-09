"""
Movie Marketing 9:16 Instagram Reel Generator
==============================================
An automated, production-ready Python pipeline designed for Google Colab and local environments.

Features:
1. YouTube Trailer Downloader (yt-dlp)
2. Multi-LLM Marketing Script & Hook Generator (OpenAI GPT-4o, DeepSeek, Google Gemini)
3. Multi-Key ElevenLabs Voiceover Generation with gTTS fallback
4. Word-level Transcription & Timestamps (OpenAI Whisper)
5. Alex Hormozi-Style Dynamic Captions (Pillow + MoviePy)
6. 9:16 Split-Screen Vertical Video Composition (MoviePy)
7. Audio Mixing with Background Music (MoviePy)
"""

import os
import sys
import json
import logging
import math
import requests
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, field

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Video & Audio Processing
import yt_dlp
from moviepy.editor import (
    VideoFileClip,
    AudioFileClip,
    CompositeVideoClip,
    ImageClip,
    CompositeAudioClip,
    concatenate_videoclips,
)

# AI Models
import openai
import whisper
from gtts import gTTS

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ReelGenerator")


@dataclass
class ReelConfig:
    movie_title: str
    website_video_path: str
    output_path: str = "final_instagram_reel.mp4"
    bgm_path: Optional[str] = None
    
    # LLM API Keys & Provider Choice
    llm_provider: str = "openai"  # Choices: 'openai', 'deepseek', 'gemini'
    openai_api_key: Optional[str] = field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    deepseek_api_key: Optional[str] = field(default_factory=lambda: os.getenv("DEEPSEEK_API_KEY"))
    gemini_api_key: Optional[str] = field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    
    # ElevenLabs API Keys (Primary & Backup)
    elevenlabs_api_keys: List[str] = field(default_factory=lambda: [
        k for k in [os.getenv("ELEVENLABS_API_KEY_1"), os.getenv("ELEVENLABS_API_KEY_2"), os.getenv("ELEVENLABS_API_KEY")] if k
    ])
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default voice: Rachel
    
    # Video Customizations
    canvas_size: Tuple[int, int] = (1080, 1920)
    clip_duration: float = 15.0
    bgm_volume: float = 0.12
    font_url: str = "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-ExtraBold.ttf"
    font_filename: str = "Montserrat-ExtraBold.ttf"
    highlight_color: Tuple[int, int, int] = (255, 230, 0)  # Bright Yellow
    text_color: Tuple[int, int, int] = (255, 255, 255)      # White
    stroke_color: Tuple[int, int, int] = (0, 0, 0)          # Black
    stroke_width: int = 6


class YouTubeTrailerDownloader:
    """Automates searching and downloading YouTube movie trailers programmatically using yt-dlp."""

    @staticmethod
    def download_trailer(movie_title: str, output_dir: str = "downloads") -> str:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        output_template = str(Path(output_dir) / "%(id)s.%(ext)s")
        search_query = f"ytsearch1:{movie_title} official trailer"

        logger.info(f"Searching YouTube for trailer: '{movie_title}'...")

        ydl_opts = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "merge_output_format": "mp4",
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=True)
            if "entries" in info and len(info["entries"]) > 0:
                video_info = info["entries"][0]
            else:
                video_info = info
            
            filename = ydl.prepare_filename(video_info)
            if not filename.endswith(".mp4"):
                filename = str(Path(filename).with_suffix(".mp4"))

        logger.info(f"Trailer downloaded successfully: {filename}")
        return filename


class ScriptGeneratorMultiLLM:
    """Multi-provider LLM Script & Hook generator supporting OpenAI, DeepSeek, and Gemini."""

    def __init__(self, config: ReelConfig):
        self.config = config

    def generate(self, movie_title: str, target_duration_sec: float = 15.0) -> Dict[str, Any]:
        provider = self.config.llm_provider.lower()
        logger.info(f"Generating marketing script with provider: '{provider}'...")

        prompt = f"""
You are an expert social media marketer creating a viral 9:16 Instagram Reel for the movie '{movie_title}'.
Target script spoken duration: ~{target_duration_sec} seconds (approx. 35-50 words).

Provide your output strictly in valid JSON format with the following keys:
- "hook": A high-converting, attention-grabbing opening hook (1 sentence).
- "body": The main compelling marketing pitch explaining why users must watch this movie and visit our website.
- "call_to_action": Short CTA encouraging viewers to click the link in bio / check out our website.
- "full_script": The combined spoken text of hook + body + call_to_action.
- "suggested_start_time": Estimated start timestamp (in seconds, e.g. 15.0) within the trailer for the most action-packed visual sequence.

Output MUST be raw JSON only, no markdown formatting.
"""

        client = None
        model_name = "gpt-4o"

        if provider == "deepseek":
            api_key = self.config.deepseek_api_key or os.getenv("DEEPSEEK_API_KEY")
            if not api_key:
                raise ValueError("DeepSeek API key missing!")
            client = openai.OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
            model_name = "deepseek-chat"

        elif provider == "gemini":
            api_key = self.config.gemini_api_key or os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("Gemini API key missing!")
            client = openai.OpenAI(
                api_key=api_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
            model_name = "gemini-2.5-flash"

        else:  # Default: OpenAI
            api_key = self.config.openai_api_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key missing!")
            client = openai.OpenAI(api_key=api_key)
            model_name = "gpt-4o"

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a professional video copywriter. Return raw JSON strictly."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        logger.info(f"Script generated via {model_name}:\nHook: {data.get('hook')}\nScript: {data.get('full_script')}")
        return data


class MultiKeyVoiceoverGenerator:
    """Generates voiceover audio using ElevenLabs API with key rotation and gTTS fallback."""

    def __init__(self, api_keys: List[str], voice_id: str = "21m00Tcm4TlvDq8ikWAM"):
        self.api_keys = [k for k in api_keys if k]
        self.voice_id = voice_id

    def generate_audio(self, text: str, output_path: str = "voiceover.mp3") -> str:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"

        for idx, key in enumerate(self.api_keys):
            try:
                logger.info(f"Attempting ElevenLabs voiceover generation with Key #{idx + 1}...")
                headers = {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": key
                }
                payload = {
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.0,
                        "use_speaker_boost": True
                    }
                }
                response = requests.post(url, json=payload, headers=headers, timeout=30)
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    logger.info(f"ElevenLabs voiceover successfully generated with Key #{idx + 1} -> {output_path}")
                    return output_path
                else:
                    logger.warning(f"ElevenLabs Key #{idx + 1} failed ({response.status_code}): {response.text[:100]}")
            except Exception as e:
                logger.warning(f"ElevenLabs Key #{idx + 1} error: {e}")

        # Fallback to gTTS if all ElevenLabs keys fail or are unavailable
        logger.info("Falling back to gTTS (Google Text-to-Speech)...")
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(output_path)
        logger.info(f"gTTS voiceover saved to {output_path}")
        return output_path


class WhisperTranscriber:
    """Uses OpenAI Whisper to get accurate word-level timestamps for voiceover audio."""

    def __init__(self, model_name: str = "base"):
        logger.info(f"Loading Whisper model ('{model_name}')...")
        self.model = whisper.load_model(model_name)

    def transcribe_words(self, audio_path: str) -> List[Dict[str, Any]]:
        logger.info(f"Transcribing audio with word-level timestamps: {audio_path}...")
        result = self.model.transcribe(audio_path, word_timestamps=True)
        
        words_data = []
        for segment in result.get("segments", []):
            for word_info in segment.get("words", []):
                clean_word = word_info["word"].strip()
                if clean_word:
                    words_data.append({
                        "word": clean_word.upper(),
                        "start": word_info["start"],
                        "end": word_info["end"]
                    })

        logger.info(f"Extracted {len(words_data)} word timestamps.")
        return words_data


class HormoziCaptionRenderer:
    """Renders dynamic, centered, bold, colored captions (Alex Hormozi style) using Pillow."""

    def __init__(self, config: ReelConfig):
        self.config = config
        self.font_path = self._ensure_font()

    def _ensure_font(self) -> str:
        font_file = Path(self.config.font_filename)
        if not font_file.exists():
            logger.info(f"Downloading custom font from {self.config.font_url}...")
            try:
                res = requests.get(self.config.font_url, timeout=15)
                if res.status_code == 200:
                    font_file.write_bytes(res.content)
            except Exception as e:
                logger.warning(f"Failed to download font: {e}. Falling back to default system font.")
        return str(font_file) if font_file.exists() else ""

    def _get_font(self, size: int) -> ImageFont.ImageFont:
        if self.font_path:
            try:
                return ImageFont.truetype(self.font_path, size)
            except Exception:
                pass
        return ImageFont.load_default()

    def _group_words(self, words: List[Dict[str, Any]], max_words_per_group: int = 3) -> List[Dict[str, Any]]:
        groups = []
        for i in range(0, len(words), max_words_per_group):
            chunk = words[i:i + max_words_per_group]
            start_t = chunk[0]["start"]
            end_t = chunk[-1]["end"]
            groups.append({
                "words": chunk,
                "start": start_t,
                "end": end_t
            })
        return groups

    def render_caption_clips(
        self,
        words: List[Dict[str, Any]],
        video_size: Tuple[int, int] = (1080, 1920),
        y_position: int = 920
    ) -> List[ImageClip]:
        logger.info("Building Alex Hormozi-style dynamic caption overlays...")
        groups = self._group_words(words, max_words_per_group=3)
        caption_clips = []

        font_size = 72
        font = self._get_font(font_size)

        for group in groups:
            group_words = group["words"]

            for active_idx, target_word in enumerate(group_words):
                w_start = target_word["start"]
                w_end = target_word["end"]
                duration = max(0.1, w_end - w_start)

                img = Image.new("RGBA", video_size, (0, 0, 0, 0))
                draw = ImageDraw.Draw(img)

                full_text = " ".join([w["word"] for w in group_words])
                bbox = draw.textbbox((0, 0), full_text, font=font)
                total_width = bbox[2] - bbox[0]
                start_x = (video_size[0] - total_width) // 2

                current_x = start_x
                for idx, word_info in enumerate(group_words):
                    word_str = word_info["word"]
                    color = self.config.highlight_color if idx == active_idx else self.config.text_color

                    draw.text(
                        (current_x, y_position),
                        word_str,
                        font=font,
                        fill=color,
                        stroke_width=self.config.stroke_width,
                        stroke_fill=self.config.stroke_color
                    )

                    word_bbox = draw.textbbox((0, 0), word_str + " ", font=font)
                    current_x += (word_bbox[2] - word_bbox[0])

                img_np = np.array(img)
                clip = (
                    ImageClip(img_np)
                    .set_start(w_start)
                    .set_duration(duration)
                    .set_position((0, 0))
                )
                caption_clips.append(clip)

        logger.info(f"Generated {len(caption_clips)} caption frame overlays.")
        return caption_clips


class ReelVideoComposer:
    """Merges trailer clip, website screen recording, voiceover, BGM, and captions into a 9:16 Reel."""

    def __init__(self, config: ReelConfig):
        self.config = config

    def create_reel(
        self,
        trailer_path: str,
        website_video_path: str,
        voiceover_path: str,
        word_timestamps: List[Dict[str, Any]],
        trailer_start_time: float = 10.0
    ) -> str:
        logger.info("Starting video composition pipeline...")

        # 1. Load Audio Clips
        voiceover_audio = AudioFileClip(voiceover_path)
        total_duration = voiceover_audio.duration

        # 2. Process Trailer Clip (Top Half: 1080x960)
        logger.info(f"Loading trailer video from '{trailer_path}'...")
        trailer = VideoFileClip(trailer_path)
        
        if trailer_start_time + total_duration > trailer.duration:
            trailer_start_time = max(0.0, trailer.duration - total_duration - 1.0)

        trailer_sub = trailer.subclip(trailer_start_time, trailer_start_time + total_duration)
        
        trailer_resized = trailer_sub.resize(width=1080)
        if trailer_resized.h < 960:
            trailer_resized = trailer_sub.resize(height=960)
        
        x_center = trailer_resized.w / 2
        y_center = trailer_resized.h / 2
        trailer_top = trailer_resized.crop(
            x1=x_center - 540,
            y1=y_center - 480,
            x2=x_center + 540,
            y2=y_center + 480
        ).set_position((0, 0))

        # 3. Process Website Screen Recording Video (Bottom Half: 1080x960)
        logger.info(f"Loading website screen recording from '{website_video_path}'...")
        web_video = VideoFileClip(website_video_path)
        if web_video.duration < total_duration:
            n_loops = math.ceil(total_duration / web_video.duration)
            web_video = concatenate_videoclips([web_video] * n_loops)

        web_sub = web_video.subclip(0, total_duration)
        web_resized = web_sub.resize(width=1080)
        if web_resized.h < 960:
            web_resized = web_sub.resize(height=960)

        web_x_center = web_resized.w / 2
        web_y_center = web_resized.h / 2
        web_bottom = web_resized.crop(
            x1=web_x_center - 540,
            y1=web_y_center - 480,
            x2=web_x_center + 540,
            y2=web_y_center + 480
        ).set_position((0, 960))

        # 4. Audio Mixing (Voiceover + BGM)
        audio_components = [voiceover_audio]
        if self.config.bgm_path and Path(self.config.bgm_path).exists():
            logger.info(f"Mixing background music: '{self.config.bgm_path}'...")
            bgm = AudioFileClip(self.config.bgm_path)
            if bgm.duration < total_duration:
                n_loops = math.ceil(total_duration / bgm.duration)
                bgm = concatenate_videoclips([bgm] * n_loops).audio
            
            bgm_sub = bgm.subclip(0, total_duration).volumex(self.config.bgm_volume)
            audio_components.append(bgm_sub)

        final_audio = CompositeAudioClip(audio_components)

        # 5. Render Dynamic Captions
        caption_renderer = HormoziCaptionRenderer(self.config)
        caption_clips = caption_renderer.render_caption_clips(
            words=word_timestamps,
            video_size=self.config.canvas_size,
            y_position=920
        )

        # 6. Composite Final 9:16 Video
        logger.info("Compositing all video layers and audio...")
        all_layers = [trailer_top, web_bottom] + caption_clips

        final_video = CompositeVideoClip(all_layers, size=self.config.canvas_size)
        final_video = final_video.set_duration(total_duration).set_audio(final_audio)

        # 7. Export File
        output_file = self.config.output_path
        logger.info(f"Exporting final Instagram Reel to '{output_file}'...")
        final_video.write_videofile(
            output_file,
            fps=30,
            codec="libx264",
            audio_codec="aac",
            threads=4,
            preset="medium"
        )

        logger.info("Instagram Reel export complete!")
        return output_file


# ==========================================
# Main Execution Function
# ==========================================

def run_pipeline(
    movie_title: str,
    website_video_path: str,
    llm_provider: str = "openai",
    openai_api_key: Optional[str] = None,
    deepseek_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    elevenlabs_api_keys: Optional[List[str]] = None,
    bgm_path: Optional[str] = None,
    output_reel_path: str = "instagram_reel_916.mp4"
) -> str:
    """Executes the full end-to-end Movie Reel generation pipeline."""
    
    config = ReelConfig(
        movie_title=movie_title,
        website_video_path=website_video_path,
        output_path=output_reel_path,
        bgm_path=bgm_path,
        llm_provider=llm_provider,
        openai_api_key=openai_api_key or os.getenv("OPENAI_API_KEY"),
        deepseek_api_key=deepseek_api_key or os.getenv("DEEPSEEK_API_KEY"),
        gemini_api_key=gemini_api_key or os.getenv("GEMINI_API_KEY"),
        elevenlabs_api_keys=elevenlabs_api_keys or [
            k for k in [os.getenv("ELEVENLABS_API_KEY_1"), os.getenv("ELEVENLABS_API_KEY_2"), os.getenv("ELEVENLABS_API_KEY")] if k
        ]
    )

    # Step 1: Download YouTube Trailer
    downloader = YouTubeTrailerDownloader()
    trailer_path = downloader.download_trailer(movie_title)

    # Step 2: Generate Script with Selected LLM
    gpt = ScriptGeneratorMultiLLM(config)
    script_data = gpt.generate(movie_title, target_duration_sec=15.0)
    full_script = script_data.get("full_script", f"Watch {movie_title} now!")
    suggested_start = float(script_data.get("suggested_start_time", 10.0))

    # Step 3: Voiceover Audio Generation with Multi-Key Rotation
    vo_gen = MultiKeyVoiceoverGenerator(api_keys=config.elevenlabs_api_keys)
    voiceover_path = vo_gen.generate_audio(full_script, output_path="voiceover.mp3")

    # Step 4: Word Timestamps with OpenAI Whisper
    transcriber = WhisperTranscriber(model_name="base")
    word_timestamps = transcriber.transcribe_words(voiceover_path)

    # Step 5: Composite 9:16 Reel Video
    composer = ReelVideoComposer(config)
    final_output = composer.create_reel(
        trailer_path=trailer_path,
        website_video_path=website_video_path,
        voiceover_path=voiceover_path,
        word_timestamps=word_timestamps,
        trailer_start_time=suggested_start
    )

    print(f"\n🎉 SUCCESS! Instagram Reel created: {final_output}")
    return final_output


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Automate 9:16 Instagram Reel Creation for Movie Marketing.")
    parser.add_argument("--movie", type=str, required=True, help="Movie Title (e.g., 'Oppenheimer')")
    parser.add_argument("--web_video", type=str, required=True, help="Path to local website screen recording MP4")
    parser.add_argument("--provider", type=str, default="openai", choices=["openai", "deepseek", "gemini"], help="LLM Provider")
    parser.add_argument("--bgm", type=str, default=None, help="Path to Background Music MP3 (Optional)")
    parser.add_argument("--output", type=str, default="final_reel.mp4", help="Output MP4 filename")

    args = parser.parse_args()

    run_pipeline(
        movie_title=args.movie,
        website_video_path=args.web_video,
        llm_provider=args.provider,
        bgm_path=args.bgm,
        output_reel_path=args.output
    )
