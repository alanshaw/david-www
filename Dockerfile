FROM node:6-alpine

WORKDIR /opt
EXPOSE 1337
VOLUME ["/opt/data"]

RUN apk add --no-cache make gcc g++ python

ADD . /opt
RUN npm install &&            \
    npm run build &&          \
    npm prune --production && \
    npm cache clean

CMD ["npm", "start"]
