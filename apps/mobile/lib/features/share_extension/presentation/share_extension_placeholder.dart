import "package:flutter/material.dart";

import "../application/handle_shared_url.dart";
import "../infrastructure/share_intake_api.dart";

class ShareExtensionPlaceholder extends StatefulWidget {
  const ShareExtensionPlaceholder({super.key});

  @override
  State<ShareExtensionPlaceholder> createState() => _ShareExtensionPlaceholderState();
}

class _ShareExtensionPlaceholderState extends State<ShareExtensionPlaceholder> {
  late final HandleSharedUrl _handleSharedUrl;
  final TextEditingController _controller = TextEditingController();
  String _result = "No request yet";

  @override
  void initState() {
    super.initState();
    _handleSharedUrl = HandleSharedUrl(
      ShareIntakeApi(baseUrl: "http://localhost:3000"),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final url = _controller.text.trim();
    if (url.isEmpty) {
      setState(() {
        _result = "URL is required";
      });
      return;
    }

    try {
      final response = await _handleSharedUrl.execute(url);
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
          const Text("Share Extension Intake Test"),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: "https://example.com",
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: _submit, child: const Text("Send")),
          const SizedBox(height: 12),
          Text(_result),
        ],
      ),
    );
  }
}
