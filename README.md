# Hublots REST APIs

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Build and Run Locally](#build-and-run-locally)
4. [Notes](#notes)

---

## Prerequisites

Ensure you have the following installed:

- Docker
- Docker Compose
- A GitHub account

---

## Setup Instructions

### 1. Clone the Repository

Clone this repository to your local machine:

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Create .env from .env.example

Copy the .env.example to a .env and use your preferred text eeditor to upate the values:

```bash
# Copy template
cp .env.example .env

# Modify values to actual ones.
nano .env
```

---

## Build and Run Locally

### 1. Build the Image

Run the following command to build the image using Docker Compose:

```bash
docker-compose build
```

Docker Compose will generate an image with a default name based on the service name and project folder.

### 2. Run the Containers

Start the containers:

```bash
docker-compose up
```

---

## Notes

- The `docker-compose.yml` file can include both `build` and `image` keys, but the `build` context is ignored if the `image` is already built or pulled.
- Use version tags for images to track and manage deployments effectively.

---

## License

This project is licensed under the [MIT License](LICENSE).
