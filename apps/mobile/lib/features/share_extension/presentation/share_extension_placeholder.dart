import "package:flutter/material.dart";

import "../application/handle_shared_url.dart";
import "../infrastructure/share_intake_api.dart";
import "../infrastructure/shared_url_channel.dart";

class ShareExtensionPlaceholder extends StatefulWidget {
  const ShareExtensionPlaceholder({super.key});

  @override
  State<ShareExtensionPlaceholder> createState() => _ShareExtensionPlaceholderState();
}

class _ShareExtensionPlaceholderState extends State<ShareExtensionPlaceholder> {
  late final HandleSharedUrl _handleSharedUrl;
  late final SharedUrlChannel _sharedUrlChannel;

  final TextEditingController _controller = TextEditingController();
  String _result = "\uC544\uC9C1 \uC694\uCCAD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.";

  @override
  void initState() {
    super.initState();
    _handleSharedUrl = HandleSharedUrl(
      ShareIntakeApi(baseUrl: "http://localhost:3000"),
    );
    _sharedUrlChannel = SharedUrlChannel();
    _loadSharedUrlFromExtension();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadSharedUrlFromExtension() async {
    final sharedUrl = await _sharedUrlChannel.getSharedUrl();
    if (sharedUrl == null || sharedUrl.isEmpty) {
      return;
    }

    setState(() {
      _controller.text = sharedUrl;
      _result = "\uACF5\uC720\uD655\uC7A5\uC5D0\uC11C URL\uC744 \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4.";
    });
  }

  Future<void> _submit() async {
    final url = _controller.text.trim();
    if (url.isEmpty) {
      setState(() {
        _result = "URL\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
      });
      return;
    }

    try {
      final response = await _handleSharedUrl.execute(url);
      await _sharedUrlChannel.clearSharedUrl();
      setState(() {
        _result = response.toString();
      });
    } catch (error) {
      setState(() {
        _result = error.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("\uACF5\uC720 URL \uC218\uC9D1 \uD14C\uC2A4\uD2B8"),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: "https://example.com",
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              ElevatedButton(
                onPressed: _submit,
                child: const Text("\uC804\uC1A1"),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _loadSharedUrlFromExtension,
                child: const Text("\uACF5\uC720 URL \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30"),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(_result),
        ],
      ),
    );
  }
}