# Hello World on Raindrop

A simple Hello World application demonstrating basic deployment using the Raindrop platform.

## Prerequisites

- A Raindrop account (Sign up at [Raindrop website](https://liquidmetal.ai/build))
- Raindrop CLI installed - Learn more about installing the CLI in the [documentation](https://docs.liquidmetal.ai/reference/getting-started/).
- Git

## Getting Started

1. Clone this repository and navigate to the project directory:
   ```shell
   git clone git@github.com:LiquidMetal-AI/liquidmetal-demos.git
   cd liquidmetal-demos/hello-world
   ```

2. Configure your project:
   - Open `raindrop.manifest`
   - Replace the organization ID with your own
   > Learn more about where to find your organization ID in the [Raindrop documentation](https://docs.liquidmetal.ai/reference/services/#http-activated-service)

3. Deploy your application:
   ```shell
   raindrop build branch
   raindrop build deploy
   ```

4. Send a request to your agent using `cURL`
    ```shell
   curl hello-world.<YOUR ORG ID>.lmapp.run
    ```