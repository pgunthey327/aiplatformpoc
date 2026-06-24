import { promises as fs } from "fs";
import path from "path";

export async function POST(req) {
    try {
        const body = await req.json();

        const filePath = path.join(
            process.cwd(),
            "data",
            "agents.json"
        );

        let agents = {};

        try {
            const existing = await fs.readFile(filePath, "utf-8");
            agents = JSON.parse(existing);
        } catch {
            agents = {};
        }

        const id = crypto.randomUUID();

        const key = `${body.agentName}|${id}|${body.version}`;

        const newAgent = {
            id,
            agentName: body.agentName,
            description: body.description,
            tags: body.tags,
            provider: body.provider,
            model: body.model,
            version: body.version,
            agentType: body.agentType,
            createdAt: new Date().toISOString(),
        };

        agents[key] = newAgent;

        await fs.mkdir(path.dirname(filePath), {
            recursive: true,
        });

        await fs.writeFile(
            filePath,
            JSON.stringify(agents, null, 2)
        );

        return Response.json({
            success: true,
            data: newAgent,
            key,
        });
    } catch (err) {
        return Response.json(
            { success: false, message: err.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const filePath = path.join(
            process.cwd(),
            "data",
            "agents.json"
        );

        const data = await fs.readFile(filePath, "utf-8");

        return Response.json({
            success: true,
            data: JSON.parse(data),
        });
    } catch (err) {
        return Response.json({
            success: true,
            data: {},
        });
    }
}