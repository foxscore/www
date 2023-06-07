// ignore: avoid_web_libraries_in_flutter
import 'dart:js' as js;
import 'package:flutter/material.dart';
// import 'package:url_launcher/url_launcher.dart';

void openLink(BuildContext context, String url, {
  bool newTab = true,
}) async {
  if (newTab) {
    js.context.callMethod('open', [url]);
  } else {
    js.context.callMethod('open', [url, '_self']);
  }
  // final uri = Uri.parse(url);
  // if (await canLaunchUrl(uri)) {
  //   await launchUrl(uri);
  // } else {
  //   // Show snackbar
  //   ScaffoldMessenger.of(context).showSnackBar(
  //     SnackBar(
  //       content: Text('Could not open link: $url'),
  //     ),
  //   );
  // }
}

void copyToClipboard(String text) {
  js.context.callMethod('copyToClipboard', [text]);
}