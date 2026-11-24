
import { prisma } from "../../lib/prisma.js";

const publicSongWhere = {
  status: "APPROVED" as const,
  publishedAt: {
    not: null,
  },
  audioAssets: {
    some: {
      status: "READY" as const,
    },
  },
};

type ListSongsOptions = {
  q?: string;
  artistSlug?: string;
  genreSlug?: string;
  moodSlug?: string;
  page: number;
  limit: number;
  sort: "newest" | "oldest" | "title";
};

export async function getSongs(options: ListSongsOptions) {
  const {
    q,
    artistSlug,
    genreSlug,
    moodSlug,
    page,
    limit,
    sort,
  } = options;

  const where = {
    ...publicSongWhere,

    ...(q
      ? {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              artists: {
                some: {
                  artist: {
                    name: {
                      contains: q,
                      mode: "insensitive" as const,
                    },
                    status: "ACTIVE" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),

    ...(artistSlug
      ? {
          artists: {
            some: {
              artist: {
                slug: artistSlug,
                status: "ACTIVE" as const,
              },
            },
          },
        }
      : {}),

    ...(genreSlug
      ? {
          genres: {
            some: {
              slug: genreSlug,
            },
          },
        }
      : {}),

    ...(moodSlug
      ? {
          moods: {
            some: {
              slug: moodSlug,
            },
          },
        }
      : {}),
  };

  const orderBy =
    sort === "oldest"
      ? { publishedAt: "asc" as const }
      : sort === "title"
        ? { title: "asc" as const }
        : { publishedAt: "desc" as const };

  const skip = (page - 1) * limit;

  const [songs, total] = await prisma.$transaction([
    prisma.song.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        durationSeconds: true,
        releaseDate: true,
        language: true,
        isExplicit: true,
        coverImageKey: true,
        publishedAt: true,

        artists: {
          where: {
            artist: {
              status: "ACTIVE",
            },
          },
          select: {
            role: true,
            position: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatarImageKey: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },

        genres: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        moods: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),

    prisma.song.count({
      where,
    }),
  ]);

  return {
    songs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getSongBySlug(slug: string) {
  return prisma.song.findFirst({
    where: {
      ...publicSongWhere,
      slug,
    },

    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationSeconds: true,
      releaseDate: true,
      language: true,
      isExplicit: true,
      coverImageKey: true,
      publishedAt: true,

      artists: {
        where: {
          artist: {
            status: "ACTIVE",
          },
        },
        select: {
          role: true,
          position: true,
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
              bio: true,
              avatarImageKey: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },

      genres: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      moods: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      audioAssets: {
        where: {
          status: "READY",
        },
        select: {
          id: true,
          contentType: true,
          codec: true,
          bitrateKbps: true,
          sampleRateHz: true,
          channels: true,
          durationSeconds: true,
          versionLabel: true,
          isDefault: true,
        },
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });
}
