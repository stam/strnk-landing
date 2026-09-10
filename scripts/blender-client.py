"""Small stdio MCP client for the Blender Lab bridge."""
import asyncio
import json
import sys
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    launcher, script = sys.argv[1:3]
    params = StdioServerParameters(command=launcher, args=['--python', '3.11', '--from', 'git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp', 'blender-mcp'])
    async with stdio_client(params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            await session.initialize()
            response = await session.call_tool('execute_blender_code', {'code': Path(script).read_text(encoding='utf-8')})
            for content in response.content:
                if content.type == 'text':
                    print(content.text, flush=True)

asyncio.run(main())
