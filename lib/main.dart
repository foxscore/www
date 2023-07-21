import 'dart:html';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:www/js_utils.dart';
import 'package:www/project_utils.dart';
import 'package:www/projects/fvpr.dart';
import 'package:www/projects/occ.dart';

import 'ccard.dart';

void main() {
  runApp(const MyApp());
}

double windowWidth = 0.0;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fox_score',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orangeAccent),
        useMaterial3: true,
      ),
      home: LayoutBuilder(
        builder: (context, constraints) {
          final aspectRatio = constraints.maxWidth / constraints.maxHeight;
          if (aspectRatio < 0.65  ) {
            windowWidth = constraints.maxWidth;
            return const MyHomePage();
          } else {
            windowWidth = constraints.maxHeight * 0.95 * 9 / 16;
            if (windowWidth < 400) windowWidth = 400;
            return Scaffold(
              backgroundColor: Theme.of(context).colorScheme.primary,
              body: Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16.0),
                  child: SizedBox(
                    height: constraints.maxHeight * 0.95,
                    width: windowWidth,
                    child: const MyHomePage(),
                  ),
                ),
              )
            );
          }
        },
      ),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});
  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: SingleChildScrollView(
          scrollDirection: Axis.vertical,
          child: Column(
            children: [
              _discordCard(),
              _projects(),
              _linksCard(),
              _underConstructionCard(),
              _impressum(),
              const SizedBox(height: 52),
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Padding(
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 32),
        child: SizedBox(
          width: 78,
          height: 78,
          child: Image.asset('resources/rext_stylized.png'),
        ),
      ),
      bottomNavigationBar: BottomAppBar(
        child: Center(
          child: Text(
            'Fox_score',
            style: Theme.of(context).textTheme.headlineLarge,
          ),
        )
      ),
    );
  }

  Widget _discordCard() {
    return CCard(
      title: 'Discord',
      trailing: MaterialButton(
        child: Row(
          children: [
            const Icon(Icons.alternate_email),
            const SizedBox(width: 4),
            Text(
                'fox_score',
                style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
        // Copy on click
        onPressed: () async {
          // if (html.window.navigator.clipboard != null) {
          //   html.window.navigator.clipboard!.writeText('Fox_score#1678');
          //   ScaffoldMessenger.of(context).showSnackBar(
          //     const SnackBar(
          //       content: Text('Copied to clipboard'),
          //     ),
          //   );
          // }

          try {
            await copyToClipboard('fox_score');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                behavior: SnackBarBehavior.floating,
                width: windowWidth,
                content: const Text('Copied to clipboard'),
              ),
            );
          } catch(e) {
            if (kDebugMode) {
              print(e);
            }
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Error'),
                content: const Text('Failed to copy to clipboard'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('OK'),
                  ),
                ],
              ),
            );
          }
        },
      ),
      children: const [],
    );
  }

  Widget _projectButton(String text, WidgetBuilder builder) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48.0),
      ),
      onPressed: () => {
        // Show bottom sheet
        showModalBottomSheet(
          context: context,
          builder: (context) => SizedBox(
            width: windowWidth,
            child: builder(context),
          )
        )
      },
      child: Text(text),
    );
  }

  Widget _projects() {
    return CCard(
        title: 'Projects',
        children: [
          const SizedBox(height: 8.0),
          _projectButton('FVPR', fvprBottomSheet),
          const SizedBox(height: 8.0),
          _projectButton('OpenCC', occBottomSheet),
        ]
    );
  }

  List<Widget> _linkButton(String text, String url) {
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

  Widget _linksCard() {
    return CCard(
        title: "Links",
        children: [
          ..._linkButton('GitHub', 'https://github.com/foxscore'),
          ..._linkButton('PayPal', 'https://paypal.me/felixjkaiser'),
        ]
    );
  }

  Widget _underConstructionCard() {
    return const CCard(
      title: null,
      children: [
        Text(
          'This page is currently under construction',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _impressum() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        TextButton(
          onPressed: () => showModalBottomSheet(
            context: context,
            builder: (context) => SizedBox(
              width: windowWidth,
              child: projectBase(
                title: 'Felix Kaiser',
                children: [
                  ...row(
                    [
                      ...textButton('+43 660 50 80 541', () => openLink(context, 'tel:+436605080541')),
                      ...textButton('office@foxscore.dev', () => openLink(context, 'mailto:office@foxscore.dev')),
                    ]
                  ),
                  ...paragraph('Zacharias Werner-Gasse 27, 2344 Maria Enzersdorf (AT)'),
                ]
              )
            )
          ),
          child: const Text('Imprint')
        ),
      ],
    );
  }
}