import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API 문서입니다.',
    },
    servers: [
      {
        url: 'http://localhost:4000/',
        // url: 'https://7-mybiasphoto-team1-be-production.up.railway.app',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // JWT 토큰 사용
        },
      },
    },
  },
  apis: ['./src/modules/**/*.js'], // Swagger 주석 읽을 파일 경로
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
