import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:notice_mobile/app.dart';

void main() {
  testWidgets('NoticeApp renders share input field', (tester) async {
    await tester.pumpWidget(const NoticeApp());

    expect(find.byType(TextField), findsOneWidget);
  });
}
