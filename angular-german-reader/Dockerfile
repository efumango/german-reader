# Build the Angular application
FROM node:18-alpine as build
WORKDIR /app
COPY . /app
RUN npm install -g @angular/cli
RUN npm install
RUN npm run build

# Set up NGINX to serve the Angular app
FROM nginx:alpine
# Remove default NGINX files
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/angular-german-reader/browser /usr/share/nginx/html/german-reader
COPY ./default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
