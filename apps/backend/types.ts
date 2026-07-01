import { z } from "zod";

export const PreInterviewBody = z.object({
    github: z.string(),
});

export type PreInterviewBodyType = z.infer<typeof PreInterviewBody>;

export function extractGithubUsername(url: string): string | null {
    const match = url.match(
        /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)/i,
    );

    return match?.[1] ?? null;
}
