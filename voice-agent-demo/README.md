# Voice Agent Demo

A demo backend API built for the [LiquidMetal X SambaNova Hackathon](https://luma.com/xcx9dvik).

This project serves as an example for hackathon participants to understand how to build and deploy AI-powered applications using the Raindrop platform. To get started with your own project:
- Create an account at [liquidmetal.ai](https://liquidmetal.ai)
- Follow the [quickstart guide](https://docs.liquidmetal.ai/tutorials/claude-code-mcp-setup/)

## Overview

This project implements a voice processing pipeline that:
1. Accepts audio input (recorded audio file)
2. Transcribes it using `whisper-large-v3`
3. Processes the transcription through `llama-3.3-70b`
4. Sends the output through Hume's emotion API
5. Returns a unified JSON response

## Original Prompt

This API was built using the following prompt:

> I want to build a backend API that can handle voice input from the user (a recorded audio file).
>
> The API should receive the audio, transcribe it using whisper-large-v3, then pass the transcription into llama-3.3-70b.
>
> The output from Llama should then be sent through Hume's API.
>
> Do not use the Hume SDK because it depends on Node packages that are not supported in the V8 runtime of LiquidMetal.
>
> Instead, perform a web search to find the correct Hume REST endpoints and call them directly with fetch.
>
> Finally, return a single JSON response with the transcript, the Llama output, and the Hume result.
>
> **Constraints:**
> - Simple, stateless service
> - No authentication
> - No streaming responses (batch only)
> - Must be exposed as a single public service

## API Endpoints

### Health Check
```bash
GET /health
```
Returns a simple health status of the service.

### Process Voice
```bash
POST /process-voice
```
Processes an audio file through the entire pipeline.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file with field name `audio`

**Response:**
- Content-Type: `application/json`
- Body: JSON containing transcript, Llama output, and Hume emotion analysis

## Testing

A test script is included to verify both endpoints:

```bash
./api_test.sh
```

This script will:
1. Test the `/health` endpoint
2. Test the `/process-voice` endpoint with a sample MP3 file
3. Save the processed audio output as `output_audio.wav`

## Architecture

The service is built as a stateless, serverless function running on LiquidMetal's V8 runtime, leveraging:
- `whisper-large-v3` for speech-to-text transcription
- `llama-3.3-70b` for natural language processing
- **Hume AI** for emotion analysis via REST API calls

## Tech Stack

- LiquidMetal serverless platform
- SambaNova models via Raindrop platform
- Direct REST API integration with Hume (no SDK dependencies)
- Batch processing (no streaming)
- Single public service endpoint