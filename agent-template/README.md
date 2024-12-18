# Agent Template on Raindrop

A template for creating and deploying AI agents using the Raindrop platform.

## Prerequisites

- A Raindrop account (Sign up at [Raindrop website](https://liquidmetal.ai/build))
- Raindrop CLI installed - Learn more about installing the CLI in the [documentation](https://docs.liquidmetal.ai/reference/getting-started/)
- Git
- API keys for [Open Weather](https://openweathermap.org/api), [News API](https://newsapi.org/), and [Groq](https://groq.com/).

## Getting Started

1. Clone this repository and navigate to the project directory:
   ```shell
   git clone git@github.com:LiquidMetal-AI/liquidmetal-demos.git
   cd liquidmetal-demos/agent-template
   npm install
   ```

2. Configure your project:
   - Open `raindrop.manifest`
   - Replace the organization ID with your own
   > Learn more about where to find your organization ID in the [Raindrop documentation](https://docs.liquidmetal.ai/reference/services/#http-activated-service)

4. Set your API key secrets using the Raindrop CLI. You can learn more about setting project secrets in our [documentation](https://docs.liquidmetal.ai/reference/secrets/).

6. Deploy your agent:
   ```shell
   raindrop build branch
   raindrop build deploy
   raindrop build env set agent-template:env:GROQ_API_KEY <your-groq-api-key>
   raindrop build env set agent-template:env:NEWS_API_KEY <your-news-api-key>
   raindrop build env set agent-template:env:WEATHER_API_KEY <your-openweather-api-key>
   raindrop build start
   ```

7. Send a request to your agent using `cURL`
    ```shell
    curl --location 'agent.<YOUR ORG ID>.lmapp.run' \
    --header 'Content-Type: application/json' \
    --data '{
        "input" : "What is the capital of France, what is the weather there right now, and what is some of the latest news about that city?"
    }'
    ```
