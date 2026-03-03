import "package:flutter/services.dart";

class SharedUrlChannel {
  static const MethodChannel _channel = MethodChannel("notice/share_extension");

  Future<String?> getSharedUrl() async {
    try {
      return await _channel.invokeMethod<String>("getSharedUrl");
    } catch (_) {
      return null;
    }
  }

  Future<void> clearSharedUrl() async {
    try {
      await _channel.invokeMethod<void>("clearSharedUrl");
    } catch (_) {
      // Ignore channel errors in bootstrap stage.
    }
  }
}