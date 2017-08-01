FROM node:6-alpine

WORKDIR /opt
EXPOSE 1337
VOLUME ["/opt/data"]

ADD . /opt
RUN apk add --no-cache make gcc g++ python && \
    npm install && \
    npm run build && \
    npm prune --production && \
    npm cache clean && \
    apk del make gcc g++ python

CMD ["npm", "start"]
