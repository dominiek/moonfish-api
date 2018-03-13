FROM mhart/alpine-node:9.8

ENV NODE_ENV production

# Update & install required packages
RUN apk add --update bash git make python g++

# Install app dependencies
COPY package.json /api/package.json
RUN cd /api; npm install

# Fix bcrypt
RUN cd /api; npm rebuild bcrypt --build-from-source

# Copy app source
COPY . /api

# Set work directory to /api
WORKDIR /api

# set your port
ENV PORT 8080

# expose the port to outside world
EXPOSE  8080

RUN apk del python make g++

# start command as per package.json
CMD ["npm", "start"]
