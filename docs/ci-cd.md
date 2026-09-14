# CI/CD

## Overview

The Perry project uses GitHub Actions to automate verification of the application after changes are pushed to the repository or a Pull Request is created.

The CI pipeline verifies the .NET solution, builds Docker images, starts the Docker Compose environment and checks API availability.

Images from the `main` branch are also published to GitHub Container Registry (GHCR).

## CI Triggers

The pipeline is triggered by:

- Push to `main`
- Push to `feature/**`
- Pull Request targeting `main`

## CI Pipeline

The pipeline performs the following steps:

1. Checkout repository
2. Install .NET 8
3. Restore project dependencies
4. Build the solution in Release configuration
5. Run automated tests
6. Validate Docker Compose configuration
7. Build Docker images
8. Start Docker Compose environment
9. Check running containers
10. Check API health endpoint
11. Stop Docker environment

## GitHub Actions Workflow

The workflow is located at:

```text
.github/workflows/ci.yml