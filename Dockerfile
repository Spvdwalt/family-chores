FROM node:22-alpine
WORKDIR /app
COPY server.js .
COPY public ./public
ENV PORT=3000
ENV DATA_FILE=/app/data/data.json
EXPOSE 3000
CMD ["node", "server.js"]
