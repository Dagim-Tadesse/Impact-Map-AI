# ImpactMap AI - README Skeleton

## Problem and who it is for
*Describes the acute challenge of seasonal road flooding in Ethiopia isolating health facilities, and defines our target user personas in regional emergency bureaus and humanitarian operations.*

## How it works
*Explains the three-stage separation between flood exposure estimation, assumed operational closure, and stochastic Monte Carlo shortest-path network simulation.*

## Where and why AI is used
*Details the LightGBM machine learning model with physical monotonic constraints predicting segment flood inundation from Copernicus DEM morphology and rainfall hyetographs, superseding brittle static height rules.*

## Architecture
*Visualizes the full digital twin architecture connecting the React/MapLibre frontend, Render.com FastAPI service, Supabase PostgreSQL caching layer, and AWS CDK infrastructure.*

## Run it locally
*Provides step-by-step developer instructions for cloning the repo, running the Python core engine test suites, and launching the Vite development server.*

## Deploy it
*Documents the automated CI/CD pipeline, containerized Render backend web service deployment, and AWS CDK deployment targets.*

## Model validation and limits
*Presents the leave-one-event-out spatial cross-validation benchmark results (0.972 ROC-AUC, 0.802 PR-AUC), calibration reliability, and explicit operational limitations.*

## Cost and load test
*Summarizes sub-second simulation execution latency, memory footprint, and AWS/Render infrastructure operational cost estimates.*

## Security
*Highlights security controls including least-privilege IAM roles, CORS policy enforcement, rate limiting, and zero hardcoded production secrets.*

## Tear it down
*Outlines safe operational decommissioning procedures and resource deletion scripts for deployed cloud stacks.*

## Data and licences
*Catalogs all open data sources including OpenStreetMap, Copernicus DEM, WorldPop, ESA WorldCover, and CHIRPS along with their respective open licensing terms.*

## Team
*Introduces Dagim (Tech Lead & Backend), Anon (Frontend Lead), and Yagi (Support Developer & Documentation) and their division of responsibilities for the AWS Community Day Hackathon.*
