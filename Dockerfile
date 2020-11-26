FROM node:14

WORKDIR /opt
EXPOSE 1337
VOLUME ["/opt/data"]

ADD . /opt
RUN npm install &&            \
    npm run build &&          \
    npm prune --production && \
    npm cache clean

CMD ["npm", "start"]
