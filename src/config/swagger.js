const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Restoran Avtomatlashtirish API",
    version: "1.0.0",
    description: "Restoran avtomatlashtirish tizimi uchun API",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.js"], // API yo'llarini ko'rsating
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
