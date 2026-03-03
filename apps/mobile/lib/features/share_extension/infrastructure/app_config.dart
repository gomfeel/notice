class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    "NOTICE_API_BASE_URL",
    defaultValue: "http://127.0.0.1:3000",
  );

  static const String apiToken = String.fromEnvironment(
    "NOTICE_API_TOKEN",
    defaultValue: "",
  );
}
