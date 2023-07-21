import 'package:flutter/material.dart';
import 'package:www/js_utils.dart';

Widget projectBase({
    required String title,
    required List<Widget> children,
    List<String> chips = const [],
  }) {
  return Padding(
    padding: const EdgeInsets.all(16.0),
    child: SingleChildScrollView(
      scrollDirection: Axis.vertical,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8.0),
          Text(
            title,
            style: const TextStyle(
              fontSize: 24.0,
            ),
          ),
          ...children,
          if (chips.isNotEmpty) ...[
            const SizedBox(height: 16.0),
            Wrap(
              spacing: 8.0,
              runSpacing: 8.0,
              children: chips.map((chip) => Chip(label: Text(chip))).toList(),
            ),
          ],
        ],
      ),
    ),
  );
}

List<Widget> paragraph(String text) {
  return [
    const SizedBox(height: 16.0),
    Text(
      text,
      textAlign: TextAlign.center,
    ),
  ];
}

List<Widget> textButton(String text, VoidCallback onPressed) {
  return [
    const SizedBox(height: 16.0),
    TextButton(
        onPressed: onPressed,
        child: Text(
            text,
            textAlign: TextAlign.center,
        )
    )
  ];
}

List<Widget> linkButton(BuildContext context, String text, String url) {
  return [
    const SizedBox(height: 8.0),
    ElevatedButton(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48.0),
      ),
      onPressed: () => openLink(context, url),
      child: Text(text),
    )
  ];
}

class LinkItem {
  final IconData icon;
  final String tooltip;
  final String? url;

  const LinkItem({
    required this.icon,
    required this.tooltip,
    required this.url,
  });
}

List<Widget> linkList(BuildContext context, List<LinkItem> items) {
  return [
    const SizedBox(height: 16.0),
    Wrap(
      spacing: 16.0,
      runSpacing: 16.0,
      children: items.map((item) => Tooltip(
        message: item.tooltip,
        child: IconButton(
          icon: Icon(item.icon),
          onPressed: item.url == null ? null : () => openLink(context, item.url!),
        ),
      )).toList(),
    ),
  ];
}

List<Widget> row(List<Widget> children) {
  return [
    const SizedBox(height: 16.0),
    Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: children,
    ),
  ];
}