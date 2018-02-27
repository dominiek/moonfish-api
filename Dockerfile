FROM alpine:3.6

ENV NODE_ENV production

# Update & install required packages
RUN apk add --update nodejs bash git

# Install app dependencies
COPY package.json /api/package.json
RUN cd /api; npm install

# Copy app source
COPY . /api

# Set work directory to /api
WORKDIR /api

# set your port
ENV PORT 8080

# expose the port to outside world
EXPOSE  8080

# start command as per package.json
CMD ["npm", "start"]
