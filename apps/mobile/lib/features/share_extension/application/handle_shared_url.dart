import "../domain/shared_link.dart";
import "../infrastructure/share_intake_api.dart";

class HandleSharedUrl {
  HandleSharedUrl(this._api);

  final ShareIntakeApi _api;

  Future<Map<String, dynamic>> execute(String url) async {
    final link = SharedLink(url: url);
    return _api.intake(link);
  }
}
