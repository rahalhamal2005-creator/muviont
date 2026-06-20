import { Metadata } from "next";
import { notFound } from "next/navigation";
import MovieDetailClient from "@/components/cinematic/MovieDetailClient";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";

export const revalidate = 3600; // Cache details for 1 hour

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tmdb = new TMDBProvider();
  
  try {
    const series = await tmdb.getDetails(id);
    if (!series) {
      return {
        title: "Series Not Found | MUVIONT",
        description: "The requested TV series could not be found."
      };
    }

    const title = `${series.title} | MUVIONT`;
    const description = series.overview || `Stream ${series.title} in stunning detail on MUVIONT.`;
    const keywords = ["Muviont", "streaming", "TV series", series.title, ...(series.genres || [])];
    const canonical = `/series/${id}`;
    const image = series.backdropPath || series.posterPath || "/logo.png";

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical
      },
      openGraph: {
        title,
        description,
        url: canonical,
        type: "video.tv_show",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: `${series.title} Backdrop`
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image]
      }
    };
  } catch (err: any) {
    console.error(`Metadata generation failed for series ${id}:`, err.message);
    return {
      title: "Watch Series | MUVIONT",
      description: "Experience premium visual streaming on MUVIONT."
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const tmdb = new TMDBProvider();

  // Fetch details and recommendations in parallel, catching errors to prevent build-time crashes
  const [series, recommendations] = await Promise.all([
    tmdb.getDetails(id).catch(err => { console.error(`Series details fetch failed for ${id}:`, err.message); return null; }),
    tmdb.getRecommendations(id).catch(err => { console.error(`Series recommendations fetch failed for ${id}:`, err.message); return []; })
  ]);

  if (!series) {
    return notFound();
  }

  return (
    <MovieDetailClient 
      movie={series} 
      recommendations={recommendations} 
    />
  );
}
