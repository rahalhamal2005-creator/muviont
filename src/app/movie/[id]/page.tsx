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
    const movie = await tmdb.getDetails(id);
    if (!movie) {
      return {
        title: "Movie Not Found | MUVIONT",
        description: "The requested movie could not be found."
      };
    }

    const title = `${movie.title} | MUVIONT`;
    const description = movie.overview || `Watch ${movie.title} in luxury cinematic quality on MUVIONT.`;
    const keywords = ["Muviont", "streaming", movie.title, ...(movie.genres || [])];
    const canonical = `/movie/${id}`;
    const image = movie.backdropPath || movie.posterPath || "/logo.png";

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
        type: "video.movie",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: `${movie.title} Backdrop`
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
    console.error(`Metadata generation failed for movie ${id}:`, err.message);
    return {
      title: "Watch Movie | MUVIONT",
      description: "Experience premium visual streaming on MUVIONT."
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const rawId = id.startsWith("m-") || id.startsWith("s-") ? id.substring(2) : id;
  const tmdb = new TMDBProvider();

  // Fetch details and recommendations in parallel
  let [movie, recommendations] = await Promise.all([
    tmdb.getDetails(rawId).catch(() => null),
    tmdb.getRecommendations(rawId).catch(() => [])
  ]);

  if (!movie) {
    movie = {
      id: id,
      title: "Movie Details",
      overview: "Watch full movie online in HD quality on MUVIONT.",
      posterPath: "",
      backdropPath: "",
      mediaType: "movie",
      rating: 8.5,
      releaseDate: new Date().getFullYear().toString(),
      genres: ["Action", "Cinema"]
    };
  }

  return (
    <MovieDetailClient 
      movie={movie} 
      recommendations={recommendations} 
    />
  );
}
