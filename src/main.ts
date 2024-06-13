import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { readFileSync } from "fs";
import { join } from "path";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: true }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // Swagger initialise
  const config = new DocumentBuilder()
    .setTitle("Hublot")
    .setDescription(
      `Hublot for connecting service providers and customers. 
      The general idea of the project is to design software program connecting service providers and customers`,
    )
    .setVersion("1.0")
    .build();

  // Customize Swagger UI setup
  const customCss = readFileSync(join(__dirname, "../custom.css"), "utf8"); // Optional: Load custom CSS
  const customScript = readFileSync(
    join(__dirname, "../custom-script.js"),
    "utf8",
  ); // Load custom script

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    customCss,
    customSiteTitle: "Hublot",
    swaggerOptions: {
      customJs: customScript,
    },
  });

  const PORT = 8080;
  await app.listen(PORT, () => {
    Logger.log(`Server is runnnig on port ${PORT}`);
  });
}
bootstrap();
