# Deployment Instructions for HappyRobot Backend

## GitHub Secrets Setup

To enable automatic deployment to Fly.io via GitHub Actions, you need to add your Fly.io API token to GitHub:

1. Go to your GitHub repository: https://github.com/Alpha-Tshibangu/happyrobot-fde-inbound-carrier-sales
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the following secret:
   - Name: `FLY_API_TOKEN`
   - Value: Your Fly.io access token (starting with FlyV1...)

## Initial Fly.io App Setup

Before the GitHub Actions can deploy, you need to create the Fly.io app:

```bash
cd backend
fly launch --no-deploy --org personal --name happyrobot-backend --region iad
```

This will:
- Create the app on Fly.io
- Set up the necessary configuration
- Create a persistent volume for the database

## Manual Deployment (First Time)

For the initial deployment, run:

```bash
cd backend
fly deploy
```

## Automatic Deployments

After the initial setup, every push to the main branch that modifies the backend will automatically trigger a deployment via GitHub Actions.

## Environment Variables

The following environment variables are configured:
- `DATABASE_URL`: Points to the persistent SQLite database at `/data/happyrobot.db`
- `PORT`: Set to 8080 (Fly.io's internal port)
- `ENVIRONMENT`: Set to "production"

## Database Persistence

The SQLite database is stored in a persistent volume mounted at `/data`. This ensures data persists between deployments.

## Monitoring

You can monitor your deployment:
- GitHub Actions: Check the Actions tab in your repository
- Fly.io dashboard: https://fly.io/apps/happyrobot-backend
- Fly.io CLI: `fly status -a happyrobot-backend`

## Logs

To view logs:
```bash
fly logs -a happyrobot-backend
```

## Rollback

To rollback to a previous version:
```bash
fly releases -a happyrobot-backend
fly deploy --image <image-from-previous-release> -a happyrobot-backend
```