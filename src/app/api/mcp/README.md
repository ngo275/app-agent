# AppAgent MCP (Model-Controller-Presenter) Server API

This API allows MCP clients to modify app metadata (title, subtitle, description, keywords) via App Store Connect, with AppAgent acting as a proxy.

## Authentication

All endpoints require authentication via NextAuth.js. Use the same authentication mechanism as the main AppAgent application.

### Get Available Apps

`GET /api/mcp/auth`

Returns a list of available apps for the authenticated user/team.

## Metadata Management

### Get App Metadata

`GET /api/mcp/apps/{appId}/metadata`

Returns metadata for the specified app.

### Update App Metadata

`PUT /api/mcp/apps/{appId}/metadata`

Updates metadata for the specified app in the database. Changes are staged but not pushed to App Store Connect.

Request body:

```json
{
  "locale": "en-US",
  "title": "App Title",
  "subtitle": "App Subtitle",
  "description": "App Description",
  "keywords": "keyword1,keyword2,keyword3"
}
```

### Push Metadata to App Store Connect

`POST /api/mcp/apps/{appId}/metadata`

Pushes staged metadata changes to App Store Connect for the specified app and locale.

Request body:

```json
{
  "locale": "en-US"
}
```

## Metadata Field Limits

- Title: 30 characters
- Subtitle: 30 characters
- Description: 4000 characters
- Keywords: 100 characters
