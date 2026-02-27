import "dart:convert";
import "dart:io";

import "../domain/shared_link.dart";

class ShareIntakeApi {
  ShareIntakeApi({required this.baseUrl});

  final String baseUrl;

  Future<Map<String, dynamic>> intake(SharedLink link) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse("$baseUrl/api/intake"));
      request.headers.set(HttpHeaders.contentTypeHeader, "application/json");
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
      return jsonDecode(responseBody) as Map<String, dynamic>;
    } finally {
      client.close(force: true);
    }
  }
}
