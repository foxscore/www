import 'package:flutter/material.dart';

class CCard extends StatelessWidget {
  final String? title;
  final Widget? trailing;
  final List<Widget> children;

  const CCard({
    Key? key,
    required this.title,
    this.trailing,
    required this.children
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    const borderWidth = 2.0;

    return SizedBox(
      width: double.infinity,
      child: Card(
        elevation: 0,
        // Border
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.0),
          side: BorderSide(
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
            width: borderWidth,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0 + borderWidth),
          child: Column(children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                title == null
                  ? const SizedBox()
                  : Text(
                    title!,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                trailing ?? const SizedBox(),
              ],
            ),
            ...children,
          ]),
        ),
      ),
    );
  }
}