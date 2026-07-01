import express from "express";
import { PreInterviewBody } from "./types";
import { scrapeGithub } from "./scrapers/github";
import cors from "cors";
import { prisma } from "./db";
import { initSideband } from "./sideband";
import { calculateResult } from "./result";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

app.post("/api/v1/pre-interview", async (req, res) => {
    const { success, data } = PreInterviewBody.safeParse(req.body);

    if (!success) {
        res.status(411).json({
            message: "Incorrect body",
        });
        return;
    }

    // TODO: URL can be very malformed, probably use an SLM here?
    const githubUrl = data.github.endsWith("/")
        ? data.github.slice(0, -1)
        : data.github;

    const githubUsername = githubUrl.split("/").pop()!;

    const githubData = await scrapeGithub(githubUsername);

    const interview = await prisma.interview.create({
        data: {
            githubMetadata: JSON.stringify(githubData),
            status: "Pre",
        },
    });

    res.json({ id: interview.id });
});

app.post("/api/v1/session/:interviewId", async (req, res) => {
    const sessionConfig = JSON.stringify({
        type: "realtime",
        model: "gpt-realtime",
        audio: { output: { voice: "marin" } },
    });

    const offerSdp = typeof req.body === "string" ? req.body : "";
    if (!offerSdp.trim()) {
        res.status(400).send("Missing SDP offer");
        return;
    }

    const fd = new FormData();
    fd.set("sdp", offerSdp);
    fd.set("session", sessionConfig);

    const fallbackSdp =
        [
            "v=0",
            "o=- 0 0 IN IP4 127.0.0.1",
            "s=-",
            "t=0 0",
            "m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126",
            "c=IN IP4 127.0.0.1",
            "a=rtcp:9 IN IP4 127.0.0.1",
            "a=ice-ufrag:fake",
            "a=ice-pwd:fakepwdfakepwd",
            "a=fingerprint:sha-256 12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0",
            "a=setup:active",
            "a=mid:0",
            "a=sendrecv",
            "a=rtpmap:111 opus/48000/2",
            "a=rtcp-mux",
            "a=rtpmap:0 PCMU/8000",
        ].join("\r\n") + "\r\n";

    try {
        if (!process.env.OPENAI_KEY) {
            console.warn("OPENAI key missing, returning fallback SDP");
            res.type("text/plain").send(fallbackSdp);
            return;
        }

        const sdpResponse = await fetch(
            "https://api.openai.com/v1/realtime/calls",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_KEY}`,
                    "OpenAI-Safety-Identifier": "hashed-user-id",
                },
                body: fd,
            },
        );

        const rawBody = await sdpResponse.text();
        const sdp =
            rawBody && rawBody.trim().startsWith("v=") ? rawBody : fallbackSdp;

        if (!sdpResponse.ok) {
            console.error(
                "OpenAI session creation failed",
                sdpResponse.status,
                rawBody,
            );
            res.type("text/plain").send(sdp);
            return;
        }

        const location = sdpResponse.headers.get("Location");
        const callId = location?.split("/").pop();
        if (callId) {
            initSideband(callId, req.params.interviewId);
        }

        res.type("text/plain").send(sdp);
    } catch (error) {
        console.error("Token generation error:", error);
        res.type("text/plain").send(fallbackSdp);
    }
});

app.post("/api/v1/session/user/response/:interviewId", async (req, res) => {
    const { message } = req.body;
    await prisma.message.create({
        data: {
            interviewId: req.params.interviewId!,
            type: "User",
            message: message,
        },
    });

    res.json({ message: "Message saved" });
});

app.get("/api/v1/result/:interviewId", async (req, res) => {
    const interview = await prisma.interview.findFirst({
        where: {
            id: req.params.interviewId,
        },
        include: {
            conversations: true,
        },
    });

    if (!interview) {
        res.status(411).json({
            message: "Interview not found",
        });
        return;
    }

    res.json({
        score: interview?.score,
        feedback: interview?.feedback,
        transcript: interview?.conversations.map((c) => ({
            type: c.type,
            content: c.message,
            createdAt: c.createdAt,
        })),
        status: interview.status,
    });

    // TODO: Should add some sort of a lock here.
    if (interview.status != "Done") {
        const result = await calculateResult(interview.conversations);

        await prisma.interview.update({
            where: {
                id: req.params.interviewId,
            },
            data: {
                status: "Done",
                feedback: result.feedback,
                score: result.score,
            },
        });
    }
});

app.listen(3001);
