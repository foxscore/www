import 'package:flutter/material.dart';
import 'package:www/project_utils.dart';

Widget occBottomSheet(BuildContext context) {
  return projectBase(
      title: 'OpenCC',
      chips: [
        'Work in progress',
      ],
      children: [
        ...paragraph(
            'An open-source, easier, smoother, and more functional alternative to the VRChat Creator Companion.'
        ),
        // ...linkList(context, [
        //   const LinkItem(
        //       icon: Icons.code,
        //       tooltip: 'GitHub',
        //       url: 'https://github.com/foxscore/occ'
        //   ),
        // ]),
      ]
  );
}