FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN apt-get update && apt-get install -y nginx

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

RUN echo '#!/bin/sh\n\
nginx\n\
npm run services' > /usr/src/app/start.sh

RUN chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]