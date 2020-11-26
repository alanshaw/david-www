FROM node:14-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
COPY src ./src/
COPY --chown=node:node public ./public/
USER node
RUN npm install
EXPOSE 1337
CMD [ "node", "dist/main.js" ]
