# Partially from https://github.com/microsoft/playwright/blob/main/utils/docker/Dockerfile.noble
# Ubuntu 24.04 LTS (Noble Numbat)
FROM ubuntu:noble

# Configuration variables are at the end!

# https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

# Install Bun and deps for virtual display, noVNC, chromium, and apprise.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg unzip \
    && mkdir -p /etc/apt/keyrings \
    # Bun (replaces Node.js)
    && curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun \
    && ln -s /root/.bun/bin/bunx /usr/local/bin/bunx \
    # TurboVNC & VirtualGL instead of Xvfb+X11vnc
    && curl --proto "=https" --tlsv1.2 -fsSL https://packagecloud.io/dcommander/virtualgl/gpgkey | gpg --dearmor -o /etc/apt/trusted.gpg.d/VirtualGL.gpg \
    && curl --proto "=https" --tlsv1.2 -fsSL  https://packagecloud.io/dcommander/turbovnc/gpgkey | gpg --dearmor -o /etc/apt/trusted.gpg.d/TurboVNC.gpg \
    && curl --proto "=https" --tlsv1.2 -fsSL https://raw.githubusercontent.com/VirtualGL/repo/main/VirtualGL.list > /etc/apt/sources.list.d/VirtualGL.list \
    && curl --proto "=https" --tlsv1.2 -fsSL https://raw.githubusercontent.com/TurboVNC/repo/main/TurboVNC.list > /etc/apt/sources.list.d/TurboVNC.list \
    # update lists and install
    && apt-get update \
    && apt-get install --no-install-recommends -y \
      virtualgl turbovnc ratpoison \
      novnc websockify \
      tini \
      dos2unix \
      pip \
    # Chromium dependencies (manual install saves ~130MB vs patchright install-deps)
    && apt-get install -y --no-install-recommends \
      libnss3 \
      libnspr4 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libxkbcommon0 \
      libatspi2.0-0 \
      libxcomposite1 \
      libgbm1 \
      libpango-1.0-0 \
      libcairo2 \
      libasound2t64 \
      libxfixes3 \
      libxdamage1 \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf \
      /var/lib/apt/lists/* \
      /var/cache/* \
      /var/tmp/* \
      /tmp/* \
      /usr/share/doc/* \
    && ln -s /usr/share/novnc/vnc_auto.html /usr/share/novnc/index.html \
    && pip install apprise --break-system-packages --no-cache-dir

WORKDIR /fgc
COPY package.json bun.lock ./

# Install deps and patchright's Chromium
# --no-shell avoids chromium_headless_shell (307MB) since headless mode triggers captcha detection
RUN bun install --frozen-lockfile && bunx patchright install chromium --no-shell && du -h -d1 ~/.cache/ms-playwright

COPY . .

# Shell scripts need Linux line endings for Windows users who build locally
RUN dos2unix ./*.sh && chmod +x ./*.sh
COPY docker-entrypoint.sh /usr/local/bin/

# Build metadata (set by CI)
ARG COMMIT=""
ARG BRANCH=""
ARG NOW=""
ENV COMMIT=${COMMIT}
ENV BRANCH=${BRANCH}
ENV NOW=${NOW}

# VNC configuration
ENV VNC_PORT=5900
ENV NOVNC_PORT=6080
EXPOSE 5900
EXPOSE 6080

# Display configuration
ENV WIDTH=1920
ENV HEIGHT=1080
ENV DEPTH=24

# Show browser (patchright must run non-headless to avoid captcha)
ENV SHOW=1

HEALTHCHECK --interval=5s --timeout=5s CMD pgrep bun && curl --fail http://localhost:6080 || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD bun run epic-games.ts; bun run prime-gaming.ts; bun run gog.ts
