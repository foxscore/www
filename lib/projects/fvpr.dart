import 'package:flutter/material.dart';
import 'package:www/project_utils.dart';

Widget fvprBottomSheet(BuildContext context) {
  return projectBase(
      title: 'FVPR',
      children: [
        ...paragraph(
            'FVPR is a free package repository for the VRChat Creator Companion.'
        ),
        ...paragraph(
            'It allows you to easily share your packages with other users.'
        ),
        ...linkList(context, [
          const LinkItem(
              icon: Icons.open_in_new,
              tooltip: 'Homepage',
              url: 'https://fvpr.dev/'
          ),
          const LinkItem(
              icon: Icons.discord,
              tooltip: 'Discord Server',
              url: 'https://fvpr.dev/discord'
          )
        ]),
      ]
  );
}