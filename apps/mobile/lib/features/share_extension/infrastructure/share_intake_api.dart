import "dart:convert";
import "dart:io";

import "../domain/shared_link.dart";

class ShareIntakeApi {
  ShareIntakeApi({
    required this.baseUrl,
    this.apiToken,
  });

  final String baseUrl;
  final String? apiToken;

  Future<Map<String, dynamic>> intake(SharedLink link) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse("$baseUrl/api/intake"));
      request.headers.set(HttpHeaders.contentTypeHeader, "application/json");
      if (apiToken != null && apiToken!.trim().isNotEmpty) {
        request.headers.set("x-notice-api-token", apiToken!.trim());
      }
      request.write(
        jsonEncode({
          "url": link.url,
          "title": link.title,
          "description": link.description,
          "folders": const [
            {"name": "주식"},
            {"name": "여행"},
            {"name": "업무"},
          ],
        }),
      );

      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();
      final Map<String, dynamic> parsed = responseBody.trim().isEmpty
          ? <String, dynamic>{}
          : (jsonDecode(responseBody) as Map<String, dynamic>);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = parsed["error"]?.toString() ?? "요청 실패 (${response.statusCode})";
        throw Exception(message);
      }

      return parsed;
    } finally {
      client.close(force: true);
    }
  }
}
