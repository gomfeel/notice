import "package:flutter/material.dart";

import "features/share_extension/presentation/share_extension_placeholder.dart";

class NoticeApp extends StatelessWidget {
  const NoticeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Notice",
      home: const Scaffold(
        body: SafeArea(
          child: ShareExtensionPlaceholder(),
        ),
      ),
    );
  }
}
