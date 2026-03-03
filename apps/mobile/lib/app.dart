import "package:flutter/material.dart";

import "features/share_extension/presentation/share_extension_placeholder.dart";

class NoticeApp extends StatelessWidget {
  const NoticeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: "\uB178\uD2F0\uC2A4",
      home: Scaffold(
        body: SafeArea(
          child: ShareExtensionPlaceholder(),
        ),
      ),
    );
  }
}