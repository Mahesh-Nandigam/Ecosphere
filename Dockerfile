FROM nginx:alpine

# Copy custom nginx configuration listening on port 8080 (required by Cloud Run)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy application static files
COPY . /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
