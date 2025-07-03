<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\IndexController;
use App\Http\Controllers\StoreItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\BMRController;
use App\Http\Controllers\DiserController;
use App\Http\Controllers\StockLevelController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [IndexController::class, 'index'])->name('dashboard');

    Route::get('store-masterfile', [StoreController::class, 'index'])->name('store-masterfile');
    Route::get('stores/{store}', [StoreController::class, 'show'])->name('stores.show');
    Route::post('stores', [StoreController::class, 'store'])->name('stores.store');
    Route::delete('stores/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');
    Route::post('stores/batch-update', [StoreController::class, 'batchUpdate'])->name('stores.batch-update');

    Route::get('item-masterfile', [ItemController::class, 'index'])->name('item-masterfile');
    Route::post('items', [ItemController::class, 'store'])->name('items.store');
    Route::delete('items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');
    Route::post('items/batch-update', [ItemController::class, 'batchUpdate'])->name('items.batch-update');

    // Stock Level Routes
    Route::get('stock-level', [StockLevelController::class, 'index'])->name('stock-level');
    Route::get('stock-level/data', [StockLevelController::class, 'show'])->name('stock-level.data');
    Route::post('stock-level/batch-update', [StockLevelController::class, 'batchUpdate'])->name('stock-level.batch-update');

    // Diser Routes - Admin only
    Route::middleware(['admin'])->group(function () {
        Route::get('diser-masterfile', [DiserController::class, 'index'])->name('diser-masterfile');
        Route::post('disers', [DiserController::class, 'store'])->name('disers.store');
        Route::delete('disers/{diser}', [DiserController::class, 'destroy'])->name('disers.destroy');
        Route::post('disers/batch-update', [DiserController::class, 'batchUpdate'])->name('disers.batch-update');
    });

    // Store Item Routes
    Route::post('/stores/{store}/items', [StoreItemController::class, 'store'])->name('stores.items.store');
    Route::post('/stores/{store}/items/batch-update', [StoreItemController::class, 'batchUpdate'])->name('stores.items.batch-update');
    Route::delete('/stores/{store}/items/{storeItem}', [StoreItemController::class, 'destroy'])->name('stores.items.destroy');

    // Order Routes
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('/orders/{order}', [OrderController::class, 'getNotes'])->name('orders.get-notes');

    // BMR Routes
    Route::get('/bmr/index', [BMRController::class, 'index'])->name('bmr.index');
    Route::post('/bmr/assign-factories', [BMRController::class, 'assignFactories'])->name('bmr.assign-factories');
    Route::get('/bmr/factories', [BMRController::class, 'factories'])->name('bmr.factories');
    Route::get('/bmr/barcode', [BMRController::class, 'barcode'])->name('bmr.barcode');
    Route::post('/bmr/barcode/batch-update', [BMRController::class, 'batchUpdateBarcodes'])->name('bmr.barcode.batch-update');
    Route::delete('/bmr/barcode/{barcode}', [BMRController::class, 'destroyBarcode'])->name('bmr.barcode.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
