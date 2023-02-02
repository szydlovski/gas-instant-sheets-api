function handleRequest(req: GoogleAppsScript.Events.DoGet) {
  return new App(SpreadsheetDataProvider).handleRequest(req);
}