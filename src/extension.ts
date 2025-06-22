// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from './HelloWorldPanel';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {

	const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
	item.text = "$(beaker) Add ToDo";
	item.command='ani-todo.addTodo';
	item.show();
	
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"vstodo-sidebar",
			sidebarProvider
		)
	);

	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.helloWorld', () => {
		HelloWorldPanel.createOrShow(context.extensionUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.askQuestion', async () => {
		const answer = await vscode.window.showInformationMessage('How was Your Day?', 'Good', 'Bad');
		if (answer === "Bad") {
			vscode.window.showInformationMessage("Sorry to here.");
		} else {
			console.log(answer);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.refresh', () => {
		HelloWorldPanel.kill();
		HelloWorldPanel.createOrShow(context.extensionUri);

	}));

	context.subscriptions.push(vscode.commands.registerCommand('ani-todo.addTodo', () => {
		const { activeTextEditor } = vscode.window;
		if (!activeTextEditor) {
			vscode.window.showInformationMessage("No active text editor.");
			return;
		}
		const text = activeTextEditor.document.getText(activeTextEditor.selection);
		sidebarProvider._view?.webview.postMessage({
			type: 'new-todo',
			value: text
		});
	}));
}

export function deactivate() { }
