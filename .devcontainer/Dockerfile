FROM mcr.microsoft.com/devcontainers/base:debian-12

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN curl -fsSL https://github.com/evilmartians/lefthook/releases/download/v1.12.3/lefthook_1.12.3_Linux_x86_64.gz \
        | gzip -d > /usr/local/bin/lefthook && \
    chmod +x /usr/local/bin/lefthook

RUN curl -fsSL https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 -o /usr/local/bin/hadolint && \
    chmod +x /usr/local/bin/hadolint

RUN curl -fsSL https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.gz \
        | tar -xz -C /usr/local/bin --strip-components=1 shellcheck-v0.11.0/shellcheck

RUN curl -fsSL https://github.com/terrastruct/d2/releases/download/v0.7.1/d2-v0.7.1-linux-amd64.tar.gz \
        | tar -xz -C /usr/local/bin --strip-components=2 d2-v0.7.1/bin/d2

USER vscode

ENV NVM_DIR=/home/vscode/.nvm
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh -o /tmp/install-nvm.sh && \
    bash /tmp/install-nvm.sh && \
    rm /tmp/install-nvm.sh && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install --lts && \
    corepack enable && \
    corepack use pnpm@latest

RUN curl -fsSL https://claude.ai/install.sh -o /tmp/install-claude.sh && \
        chmod +x /tmp/install-claude.sh && \
        /tmp/install-claude.sh && \
        rm /tmp/install-claude.sh