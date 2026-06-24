# KCNA Prep — static site served by hardened nginx.
# No build step: the app is plain HTML/CSS/JS.
#
#   docker build -t kcna-prep .
#   docker run --rm -p 4178:8080 kcna-prep
#   open http://localhost:4178
#
# Pin to a digest in production for reproducibility; Dependabot keeps it fresh.
# The "unprivileged" image runs as a non-root user on port 8080 out of the box.
FROM nginxinc/nginx-unprivileged:1.31-alpine

LABEL org.opencontainers.image.title="KCNA Prep" \
      org.opencontainers.image.description="Offline-capable KCNA exam study app" \
      org.opencontainers.image.source="https://github.com/seanyfresh/kcna-prep" \
      org.opencontainers.image.licenses="MIT"

# Hardened server config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# App content.
COPY index.html manifest.webmanifest service-worker.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY data/   /usr/share/nginx/html/data/

# The base image already runs as the unprivileged "nginx" user (uid 101).
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
