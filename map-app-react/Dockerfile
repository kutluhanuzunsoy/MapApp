FROM node:lts-alpine AS builder
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --chown=node:node ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent
COPY --chown=node:node . .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --from=builder --chown=node:node /usr/src/app/build /usr/src/app/build
RUN npm install -g serve
EXPOSE 3000
USER node
CMD ["serve", "-s", "build", "-l", "3000"]