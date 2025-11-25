FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci 

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
