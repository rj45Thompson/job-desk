# The desk, hosted. RJ, 2026-09-09: "lets move it from my box to the proper hosting."
#
# There is no `claude` CLI in this image ON PURPOSE. The CLI backend is one person's logged-in
# account, and that is what let a visitor's question reach the owner's Gmail and Drive connectors
# (see ask_claude's docstring). A hosted desk answers through the API, which inherits no account,
# no settings file and no MCP server - the request carries the whole capability list. Adding the
# CLI here would re-open a bug class this image cannot otherwise have.
FROM python:3.13-slim

# curl only, for the container healthcheck. No build toolchain: the desk is stdlib plus one wheel.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip install --no-cache-dir "anthropic>=1.4,<2"

COPY desk.py index.html ./

# Résumés and per-login projects live here. THIS MUST BE A REAL VOLUME ON THE HOST - a container
# filesystem is thrown away on every deploy, and losing a user's uploaded CV silently is worse
# than refusing to start. See HOSTING.md.
RUN mkdir -p /data/uploads
ENV DESK_UPLOADS=/data/uploads DESK_PORT=8790 PYTHONUNBUFFERED=1
VOLUME ["/data"]

# Runs unprivileged: nothing in here needs root, and the desk's whole job is to be reachable by
# strangers.
RUN useradd -u 10001 -m desk && chown -R desk:desk /app /data
USER desk

EXPOSE 8790
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8790/health || exit 1

# `serve` is already "this machine only, no tunnel" - the host terminates TLS and gives the desk a
# real name, so cloudflared, the quick-tunnel watchdog and the rotating-hostname machinery are all
# out of the hosted path. (`up` is the laptop command; it would start a tunnel in here.)
CMD ["python", "desk.py", "serve"]
